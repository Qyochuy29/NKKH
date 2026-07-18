using System;
using Microsoft.Data.Sqlite;

class Program
{
    static void Main()
    {
        var connStr = "Data Source=../backend-csharp/app.db";
        using var conn = new SqliteConnection(connStr);
        conn.Open();

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT Id, FullName, Role FROM Users WHERE Role = 'phu_huynh'";
        using var reader = cmd.ExecuteReader();
        while(reader.Read())
        {
            var id = reader.GetString(0);
            var name = reader.GetString(1);
            var role = reader.GetInt32(2); // Since it's enum it might be stored as int! Let's read as string or int
            Console.WriteLine($"Parent: {name} (ID: {id}), Role: {role}");

            using var cmd2 = conn.CreateCommand();
            cmd2.CommandText = "SELECT ClassroomId FROM Students WHERE ParentId = @id";
            cmd2.Parameters.AddWithValue("@id", id);
            using var r2 = cmd2.ExecuteReader();
            while(r2.Read())
            {
                var clsId = r2.GetString(0);
                using var cmd3 = conn.CreateCommand();
                cmd3.CommandText = "SELECT Name FROM Areas WHERE Id = @cid";
                cmd3.Parameters.AddWithValue("@cid", clsId);
                var areaName = cmd3.ExecuteScalar();
                Console.WriteLine($"  -> Class: {areaName}");
            }
        }
    }
}
